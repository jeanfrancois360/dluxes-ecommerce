'use client';

/**
 * Seller Vacation Mode Settings Page
 *
 * Enable/disable vacation mode with custom message and auto-end date
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { storesAPI, VacationStatusResponse, UpdateVacationModeDto } from '@/lib/api/stores';
import {
  Palmtree,
  Calendar,
  Clock,
  MessageSquare,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Info,
  Save,
  RefreshCw,
  Power,
  PowerOff,
  ArrowRight,
  Store,
} from 'lucide-react';
import PageHeader from '@/components/seller/page-header';

export default function VacationModePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations('sellerVacationMode');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Vacation status data
  const [vacationStatus, setVacationStatus] = useState<VacationStatusResponse | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdateVacationModeDto>({
    vacationMode: false,
    vacationMessage: '',
    vacationEndDate: '',
    vacationAutoReply: '',
    vacationHideProducts: false,
  });

  // Check if user is seller
  useEffect(() => {
    if (!authLoading && user && user.role !== 'SELLER') {
      router.push('/dashboard/buyer');
    }
  }, [authLoading, user, router]);

  // Fetch vacation status
  const fetchVacationStatus = async () => {
    try {
      setIsLoading(true);
      const response = await storesAPI.getVacationStatus();
      setVacationStatus(response);

      // Populate form with current settings
      setFormData({
        vacationMode: response.vacationMode,
        vacationMessage: response.vacationMessage || '',
        vacationEndDate: response.vacationEndDate
          ? new Date(response.vacationEndDate).toISOString().split('T')[0]
          : '',
        vacationAutoReply: response.vacationAutoReply || '',
        vacationHideProducts: response.vacationHideProducts,
      });

      // Show message if auto-end was triggered
      if (response.autoEndTriggered) {
        setSuccess(t('alerts.autoEndMessage'));
      }
    } catch (err: any) {
      console.error('Failed to fetch vacation status:', err);
      setError(err.message || 'Failed to load vacation status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'SELLER') {
      fetchVacationStatus();
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleToggleVacation = async () => {
    const newVacationMode = !formData.vacationMode;
    setFormData((prev) => ({ ...prev, vacationMode: newVacationMode }));

    // If disabling, save immediately
    if (!newVacationMode) {
      await handleSubmit(null, newVacationMode);
    }
  };

  const handleSubmit = async (e: React.FormEvent | null, forceVacationMode?: boolean) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const dataToSend: UpdateVacationModeDto = {
        vacationMode: forceVacationMode !== undefined ? forceVacationMode : formData.vacationMode,
        vacationMessage: formData.vacationMessage || undefined,
        vacationEndDate: formData.vacationEndDate || undefined,
        vacationAutoReply: formData.vacationAutoReply || undefined,
        vacationHideProducts: formData.vacationHideProducts,
      };

      const response = await storesAPI.updateVacationMode(dataToSend);
      setSuccess(response.message);

      // Refresh status
      await fetchVacationStatus();
    } catch (err: any) {
      console.error('Failed to update vacation mode:', err);
      setError(err.message || 'Failed to update vacation mode');
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get minimum date for end date picker (tomorrow)
  const getMinEndDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title={t('pageTitle')}
        description={formData.vacationMode ? t('pageSubtitleActive') : t('pageSubtitleInactive')}
        breadcrumbs={[
          { label: t('breadcrumbs.dashboard'), href: '/seller' },
          { label: t('breadcrumbs.vacationMode') },
        ]}
        actions={
          <button
            onClick={handleToggleVacation}
            disabled={isSaving}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
              formData.vacationMode
                ? 'bg-black text-white border border-neutral-700 hover:bg-neutral-900'
                : 'bg-black text-[#CBB57B] border border-[#CBB57B] hover:bg-neutral-900 hover:text-[#D4C794]'
            }`}
          >
            {formData.vacationMode ? (
              <>
                <PowerOff className="w-5 h-5" />
                {t('buttons.endVacation')}
              </>
            ) : (
              <>
                <Power className="w-5 h-5" />
                {t('buttons.startVacation')}
              </>
            )}
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">{t('alerts.error')}</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-700 font-medium">{t('alerts.success')}</p>
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          </motion.div>
        )}

        {/* Status Cards */}
        {vacationStatus && formData.vacationMode && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Days on Vacation</p>
                  <p className="text-2xl font-bold text-black">{vacationStatus.daysOnVacation}</p>
                </div>
              </div>
              <p className="text-xs text-neutral-400">
                Since {formatDate(vacationStatus.vacationStartDate)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">End Date</p>
                  <p className="text-lg font-bold text-black">
                    {vacationStatus.vacationEndDate
                      ? formatDate(vacationStatus.vacationEndDate)
                      : 'No end date set'}
                  </p>
                </div>
              </div>
              {vacationStatus.daysUntilEnd !== null && (
                <p className="text-xs text-neutral-400">
                  {vacationStatus.daysUntilEnd} day{vacationStatus.daysUntilEnd !== 1 ? 's' : ''}{' '}
                  remaining
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${vacationStatus.vacationHideProducts ? 'bg-red-100' : 'bg-green-100'}`}
                >
                  {vacationStatus.vacationHideProducts ? (
                    <EyeOff className="w-6 h-6 text-red-600" />
                  ) : (
                    <Eye className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Products</p>
                  <p className="text-lg font-bold text-black">
                    {vacationStatus.vacationHideProducts ? 'Hidden' : 'Visible'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-400">
                {vacationStatus.vacationHideProducts
                  ? 'Products hidden from search'
                  : 'Products still visible with vacation banner'}
              </p>
            </motion.div>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Vacation Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
              >
                <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-gold" />
                  Vacation Message
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Message for Visitors
                    </label>
                    <textarea
                      name="vacationMessage"
                      value={formData.vacationMessage}
                      onChange={handleInputChange}
                      placeholder="Hi! We're currently on vacation and won't be able to ship orders. We'll be back soon!"
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold resize-none"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      {formData.vacationMessage?.length || 0}/500 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Auto-Reply for Inquiries
                    </label>
                    <textarea
                      name="vacationAutoReply"
                      value={formData.vacationAutoReply}
                      onChange={handleInputChange}
                      placeholder="Thank you for your inquiry. We're currently on vacation and will respond when we return."
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold resize-none"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      This message will be sent automatically to any new inquiries
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Schedule */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
              >
                <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gold" />
                  Vacation Schedule
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="vacationEndDate"
                      value={formData.vacationEndDate}
                      onChange={handleInputChange}
                      min={getMinEndDate()}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Vacation mode will automatically end on this date
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Product Visibility */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
              >
                <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-gold" />
                  Product Visibility
                </h2>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                  <div>
                    <p className="font-medium text-black">Hide Products from Search</p>
                    <p className="text-sm text-neutral-500">
                      When enabled, your products won't appear in search results during vacation
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="vacationHideProducts"
                      checked={formData.vacationHideProducts}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">What happens to your products?</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Products remain on your store page with a vacation banner</li>
                      <li>Direct links to products still work</li>
                      <li>Customers can still view but not purchase (if orders are disabled)</li>
                      {formData.vacationHideProducts && (
                        <li className="text-amber-700">
                          Products will be hidden from search results
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Save Button */}
              {formData.vacationMode && (
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={fetchVacationStatus}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Current Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`rounded-2xl p-6 border ${
                  formData.vacationMode
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {formData.vacationMode ? (
                    <Palmtree className="w-6 h-6 text-amber-500 flex-shrink-0" />
                  ) : (
                    <Store className="w-6 h-6 text-green-500 flex-shrink-0" />
                  )}
                  <div>
                    <h3
                      className={`font-semibold mb-1 ${formData.vacationMode ? 'text-amber-900' : 'text-green-900'}`}
                    >
                      {formData.vacationMode ? 'On Vacation' : 'Store Active'}
                    </h3>
                    <p
                      className={`text-sm ${formData.vacationMode ? 'text-amber-700' : 'text-green-700'}`}
                    >
                      {formData.vacationMode
                        ? 'Your store is showing the vacation message to visitors.'
                        : 'Your store is open and accepting orders normally.'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
              >
                <h3 className="text-lg font-bold text-black mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <Link
                    href="/seller"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors group"
                  >
                    <span className="text-sm font-medium">Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-gold transition-colors" />
                  </Link>
                  <Link
                    href="/seller/store/settings"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors group"
                  >
                    <span className="text-sm font-medium">Store Settings</span>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-gold transition-colors" />
                  </Link>
                  <Link
                    href="/seller/orders"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors group"
                  >
                    <span className="text-sm font-medium">Pending Orders</span>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-gold transition-colors" />
                  </Link>
                </div>
              </motion.div>

              {/* Help Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-blue-50 rounded-2xl p-6 border border-blue-100"
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Tips for Vacation Mode</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>
                        <strong>Before leaving:</strong> Ship all pending orders
                      </li>
                      <li>
                        <strong>Set an end date:</strong> So you don't forget to reactivate
                      </li>
                      <li>
                        <strong>Write a friendly message:</strong> Let customers know when you'll be
                        back
                      </li>
                      <li>
                        <strong>Check inquiries:</strong> Respond to any urgent messages before
                        leaving
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
