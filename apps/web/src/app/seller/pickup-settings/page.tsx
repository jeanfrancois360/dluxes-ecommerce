'use client';

/**
 * Seller Pickup Settings Page
 * Configure self-pickup options for customers
 *
 * v2.10.0 - Self-Pickup Feature
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import {
  sellerPickupAPI,
  SellerPickupSettings,
  UpdatePickupSettingsDto,
} from '@/lib/api/seller-pickup';
import {
  MapPin,
  CheckCircle,
  AlertTriangle,
  Info,
  Save,
  Loader2,
  AlertCircle,
  Clock,
  DollarSign,
  MapPinned,
  FileText,
} from 'lucide-react';
import PageHeader from '@/components/seller/page-header';

export default function PickupSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Settings data
  const [settings, setSettings] = useState<SellerPickupSettings | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdatePickupSettingsDto>({
    pickupEnabled: false,
    pickupAddress: '',
    pickupInstructions: '',
    pickupHours: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: '',
    },
    pickupRadius: 50,
    pickupFee: 0,
    pickupEstimatedMinutes: 30,
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

      const settingsData = await sellerPickupAPI.getSettings();
      setSettings(settingsData);

      // Populate form with existing data
      setFormData({
        pickupEnabled: settingsData.pickupEnabled,
        pickupAddress: settingsData.pickupAddress || '',
        pickupInstructions: settingsData.pickupInstructions || '',
        pickupHours: settingsData.pickupHours || {
          monday: '',
          tuesday: '',
          wednesday: '',
          thursday: '',
          friday: '',
          saturday: '',
          sunday: '',
        },
        pickupRadius: settingsData.pickupRadius || 50,
        pickupFee: settingsData.pickupFee || 0,
        pickupEstimatedMinutes: settingsData.pickupEstimatedMinutes || 30,
      });
    } catch (err: any) {
      console.error('Failed to fetch pickup settings:', err);
      setError(err.message || 'Failed to load pickup settings');
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
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handlePickupHoursChange = (day: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      pickupHours: {
        ...prev.pickupHours,
        [day]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Clean up pickup hours - remove empty entries
      const cleanedHours: Record<string, string> = {};
      Object.entries(formData.pickupHours || {}).forEach(([day, hours]) => {
        if (hours && hours.trim()) {
          cleanedHours[day] = hours.trim();
        }
      });

      const dataToSend: UpdatePickupSettingsDto = {
        ...formData,
        pickupHours: Object.keys(cleanedHours).length > 0 ? cleanedHours : undefined,
      };

      await sellerPickupAPI.updateSettings(dataToSend);
      setSuccess('Pickup settings saved successfully!');

      // Refresh settings
      await fetchSettings();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to update pickup settings:', err);
      setError(err.message || 'Failed to update pickup settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin" />
      </div>
    );
  }

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title="Self-Pickup Settings"
        description="Let customers pick up their orders directly from your store"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Benefits Section - Only show if not enabled */}
        {!formData.pickupEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-200 p-6"
          >
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Why offer self-pickup?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 mb-1">No Shipping Fees</h3>
                  <p className="text-sm text-neutral-600">
                    Customers save money and you avoid shipping logistics
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 mb-1">Local Customers</h3>
                  <p className="text-sm text-neutral-600">
                    Attract nearby customers who prefer pickup
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 mb-1">Faster Delivery</h3>
                  <p className="text-sm text-neutral-600">
                    Customers get their orders same day or next day
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pickup Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Pickup Status</h2>
              {formData.pickupEnabled ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Pickup Enabled</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Pickup Disabled</span>
                </div>
              )}

              {settings?.storeName && (
                <p className="mt-2 text-sm text-neutral-600">Store: {settings.storeName}</p>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm font-medium text-neutral-700">
                {formData.pickupEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  name="pickupEnabled"
                  checked={formData.pickupEnabled}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:ring-4 peer-focus:ring-gold/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
              </div>
            </label>
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
        </AnimatePresence>

        {/* Configuration Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6"
        >
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <MapPinned className="w-6 h-6 text-gold" />
              <h2 className="text-xl font-semibold text-neutral-900">Pickup Configuration</h2>
            </div>
            <p className="text-sm text-neutral-600">
              Configure where and when customers can pick up their orders
            </p>
          </div>

          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">How does self-pickup work?</p>
                <p>
                  When customers checkout, they'll see a pickup option if they're within your pickup
                  radius. They'll receive a unique 6-digit code to show when collecting their order.
                </p>
              </div>
            </div>

            {/* Pickup Address */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Pickup Address <span className="text-neutral-500">(Optional)</span>
              </label>
              <p className="text-xs text-neutral-500 mb-2">Leave empty to use your store address</p>
              <input
                type="text"
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleInputChange}
                placeholder={
                  settings?.storeAddress
                    ? `Default: ${settings.storeAddress}`
                    : 'Enter pickup address'
                }
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all"
              />
            </div>

            {/* Pickup Instructions */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Pickup Instructions <span className="text-neutral-500">(Optional)</span>
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                Help customers find you (e.g., "Enter through back door", "Call when you arrive")
              </p>
              <textarea
                name="pickupInstructions"
                value={formData.pickupInstructions}
                onChange={handleInputChange}
                placeholder="e.g., Enter through the main entrance and ask for the pickup counter"
                rows={3}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all resize-none"
              />
            </div>

            {/* Pickup Hours */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Pickup Hours <span className="text-neutral-500">(Optional)</span>
              </label>
              <p className="text-xs text-neutral-500 mb-3">
                When can customers pick up their orders? Leave empty for days you're closed
              </p>
              <div className="space-y-2">
                {daysOfWeek.map((day) => (
                  <div key={day.key} className="flex gap-3 items-center">
                    <label className="w-32 text-sm font-medium text-neutral-700">{day.label}</label>
                    <input
                      type="text"
                      value={formData.pickupHours?.[day.key] || ''}
                      onChange={(e) => handlePickupHoursChange(day.key, e.target.value)}
                      placeholder="e.g., 9am-5pm"
                      className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Pickup Radius */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Pickup Radius (km)
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                How far can customers be to see pickup as an option?
              </p>
              <input
                type="number"
                name="pickupRadius"
                value={formData.pickupRadius}
                onChange={handleInputChange}
                min={1}
                max={200}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Customers within {formData.pickupRadius}km will see pickup option
              </p>
            </div>

            {/* Pickup Fee */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Pickup Fee (Optional)
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                Charge a small fee for pickup preparation (usually free)
              </p>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <DollarSign className="w-5 h-5 text-neutral-400" />
                </div>
                <input
                  type="number"
                  name="pickupFee"
                  value={formData.pickupFee}
                  onChange={handleInputChange}
                  min={0}
                  step={0.01}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {formData.pickupFee === 0 ? 'FREE pickup' : `$${formData.pickupFee} pickup fee`}
              </p>
            </div>

            {/* Estimated Pickup Time */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Estimated Preparation Time (minutes)
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                How long does it take to prepare orders for pickup?
              </p>
              <input
                type="number"
                name="pickupEstimatedMinutes"
                value={formData.pickupEstimatedMinutes}
                onChange={handleInputChange}
                min={15}
                max={1440}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Orders will be ready in approximately {formData.pickupEstimatedMinutes} minutes
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t border-neutral-200">
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

        {/* Example Preview */}
        {formData.pickupEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6"
          >
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-gold" />
                <h2 className="text-xl font-semibold text-neutral-900">Customer Preview</h2>
              </div>
              <p className="text-sm text-neutral-600">
                This is how your pickup option will appear to customers at checkout
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-1">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    Self-Pickup from {settings?.storeName}
                  </h3>
                  <p className="text-sm text-neutral-700 mb-2">
                    Ready in ~{formData.pickupEstimatedMinutes} mins •{' '}
                    {formData.pickupAddress || settings?.storeAddress}
                  </p>
                  {formData.pickupInstructions && (
                    <p className="text-sm text-neutral-600 italic">{formData.pickupInstructions}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {formData.pickupFee === 0 ? 'FREE' : `$${(formData.pickupFee || 0).toFixed(2)}`}
                  </div>
                  <div className="text-xs text-neutral-500">Same day</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
