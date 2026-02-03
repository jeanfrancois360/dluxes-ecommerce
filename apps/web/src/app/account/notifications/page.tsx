'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { PageLayout } from '@/components/layout/page-layout';
import {
  notificationPreferencesApi,
  type NotificationPreferences,
} from '@/lib/api/notification-preferences';
import { toast, standardToasts } from '@/lib/utils/toast';

// Toggle Switch Component
function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 ${
        enabled ? 'bg-gold' : 'bg-neutral-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// Preference Row Component
function PreferenceRow({
  title,
  description,
  enabled,
  onChange,
  disabled = false,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-neutral-100 last:border-0">
      <div className="flex-1 pr-4">
        <p className={`font-medium ${disabled ? 'text-neutral-400' : 'text-black'}`}>{title}</p>
        <p className={`text-sm ${disabled ? 'text-neutral-300' : 'text-neutral-500'}`}>
          {description}
        </p>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// Section Header Component
function SectionHeader({
  icon,
  title,
  description,
  color = 'gold',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    gold: 'from-gold to-gold/80',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
  };

  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className={`w-10 h-10 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center`}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold font-['Poppins'] text-black">{title}</h3>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  );
}

export default function NotificationPreferencesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        const response = await notificationPreferencesApi.getPreferences();
        if (response?.data) {
          setPreferences(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch notification preferences:', error);
        toast.error('Failed to load notification preferences');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchPreferences();
    }
  }, [authLoading, user]);

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    // Optimistic update
    setPreferences({ ...preferences, [key]: value });

    try {
      setIsSaving(true);
      const response = await notificationPreferencesApi.updatePreferences({ [key]: value });
      if (response?.data) {
        setPreferences(response.data);
        toast.success('Preference updated successfully');
      }
    } catch (error) {
      // Revert on error
      setPreferences({ ...preferences, [key]: !value });
      toast.error('Failed to update preference');
    } finally {
      setIsSaving(false);
    }
  };

  // Master toggle disables all notifications
  const masterDisabled = preferences ? !preferences.notifications : true;

  if (authLoading || isLoading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] bg-neutral-50 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-black via-neutral-900 to-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumbs */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-white/60 mb-6"
          >
            <Link href="/" className="hover:text-gold transition-colors">
              Home
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/dashboard/buyer" className="hover:text-gold transition-colors">
              Account
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-medium">Notifications</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-gold to-gold/80 rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20">
              <svg
                className="w-8 h-8 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-['Poppins'] text-white mb-1">
                Notification Preferences
              </h1>
              <p className="text-lg text-white/80">
                Control how and when we contact you
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Master Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-neutral-900 to-black rounded-2xl p-6 mb-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">All Notifications</h2>
                <p className="text-white/60 text-sm">
                  Master toggle for all notifications
                </p>
              </div>
            </div>
            {preferences && (
              <ToggleSwitch
                enabled={preferences.notifications}
                onChange={(value) => updatePreference('notifications', value)}
              />
            )}
          </div>
          {!preferences?.notifications && (
            <p className="mt-4 text-amber-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              All notifications are currently disabled
            </p>
          )}
        </motion.div>

        <div className="space-y-6">
          {/* Email Notifications - Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
          >
            <SectionHeader
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
              title="Order Notifications"
              description="Updates about your orders"
              color="blue"
            />
            {preferences && (
              <div className="mt-4">
                <PreferenceRow
                  title="Order Confirmation"
                  description="Receive confirmation when you place an order"
                  enabled={preferences.emailOrderConfirmation}
                  onChange={(value) => updatePreference('emailOrderConfirmation', value)}
                  disabled={masterDisabled}
                />
                <PreferenceRow
                  title="Shipping Updates"
                  description="Get notified when your order ships"
                  enabled={preferences.emailOrderShipped}
                  onChange={(value) => updatePreference('emailOrderShipped', value)}
                  disabled={masterDisabled}
                />
                <PreferenceRow
                  title="Delivery Confirmation"
                  description="Know when your order has been delivered"
                  enabled={preferences.emailOrderDelivered}
                  onChange={(value) => updatePreference('emailOrderDelivered', value)}
                  disabled={masterDisabled}
                />
                <PreferenceRow
                  title="Payment Receipts"
                  description="Receive payment confirmation emails"
                  enabled={preferences.emailPaymentReceipt}
                  onChange={(value) => updatePreference('emailPaymentReceipt', value)}
                  disabled={masterDisabled}
                />
                <PreferenceRow
                  title="Refund Notifications"
                  description="Get notified when refunds are processed"
                  enabled={preferences.emailRefundProcessed}
                  onChange={(value) => updatePreference('emailRefundProcessed', value)}
                  disabled={masterDisabled}
                />
              </div>
            )}
          </motion.div>

          {/* Email Notifications - Marketing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
          >
            <SectionHeader
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              }
              title="Marketing & Promotions"
              description="Special offers and deals"
              color="purple"
            />
            {preferences && (
              <div className="mt-4">
                <PreferenceRow
                  title="Newsletter"
                  description="Weekly newsletter with latest updates and tips"
                  enabled={preferences.newsletter}
                  onChange={(value) => updatePreference('newsletter', value)}
                  disabled={masterDisabled}
                />
                <PreferenceRow
                  title="Promotional Emails"
                  description="Sales, discounts, and special offers"
                  enabled={preferences.emailPromotions}
                  onChange={(value) => updatePreference('emailPromotions', value)}
                  disabled={masterDisabled}
                />
                <PreferenceRow
                  title="Price Drop Alerts"
                  description="Get notified when items in your wishlist go on sale"
                  enabled={preferences.emailPriceDrops}
                  onChange={(value) => updatePreference('emailPriceDrops', value)}
                  disabled={masterDisabled}
                />
                <PreferenceRow
                  title="Back in Stock"
                  description="Alerts when out-of-stock items become available"
                  enabled={preferences.emailBackInStock}
                  onChange={(value) => updatePreference('emailBackInStock', value)}
                  disabled={masterDisabled}
                />
              </div>
            )}
          </motion.div>

          {/* Email Notifications - Account */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
          >
            <SectionHeader
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              title="Account & Security"
              description="Important account notifications"
              color="green"
            />
            {preferences && (
              <div className="mt-4">
                <PreferenceRow
                  title="Security Alerts"
                  description="Suspicious activity, login attempts, and password changes"
                  enabled={preferences.emailSecurityAlerts}
                  onChange={(value) => updatePreference('emailSecurityAlerts', value)}
                  disabled={masterDisabled}
                />
                <PreferenceRow
                  title="Review Reminders"
                  description="Reminders to review products you've purchased"
                  enabled={preferences.emailReviewReminder}
                  onChange={(value) => updatePreference('emailReviewReminder', value)}
                  disabled={masterDisabled}
                />
              </div>
            )}
          </motion.div>

          {/* Push Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
          >
            <SectionHeader
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
              title="Push Notifications"
              description="Mobile and browser notifications"
              color="gold"
            />
            {preferences && (
              <div className="mt-4">
                <PreferenceRow
                  title="Order Updates"
                  description="Real-time updates about your orders"
                  enabled={preferences.pushOrderUpdates}
                  onChange={(value) => updatePreference('pushOrderUpdates', value)}
                  disabled={masterDisabled}
                />
                <PreferenceRow
                  title="Promotional Alerts"
                  description="Flash sales and limited-time offers"
                  enabled={preferences.pushPromotions}
                  onChange={(value) => updatePreference('pushPromotions', value)}
                  disabled={masterDisabled}
                />
                <PreferenceRow
                  title="Price Drop Alerts"
                  description="Instant notifications when prices drop"
                  enabled={preferences.pushPriceDrops}
                  onChange={(value) => updatePreference('pushPriceDrops', value)}
                  disabled={masterDisabled}
                />
                <PreferenceRow
                  title="Back in Stock"
                  description="Be the first to know when items return"
                  enabled={preferences.pushBackInStock}
                  onChange={(value) => updatePreference('pushBackInStock', value)}
                  disabled={masterDisabled}
                />
                <PreferenceRow
                  title="Security Alerts"
                  description="Important security notifications"
                  enabled={preferences.pushSecurityAlerts}
                  onChange={(value) => updatePreference('pushSecurityAlerts', value)}
                  disabled={masterDisabled}
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm text-blue-800 font-medium">About notifications</p>
              <p className="text-sm text-blue-600 mt-1">
                We respect your inbox. Security alerts are always sent regardless of your
                preferences to keep your account safe. You can unsubscribe from marketing
                emails at any time.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
