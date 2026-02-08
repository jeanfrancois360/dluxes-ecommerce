'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Mail,
  Calendar,
} from 'lucide-react';

interface ApplicationStatus {
  hasApplication: boolean;
  store?: {
    id: string;
    name: string;
    status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'INACTIVE';
    appliedAt: string;
    approvedAt?: string;
  };
}

export default function ApplicationStatusPage() {
  const router = useRouter();
  const t = useTranslations('sellerApplicationStatus');
  const { user, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/become-seller/status');
      return;
    }

    if (user && user.role === 'SELLER') {
      router.push('/seller/dashboard');
      return;
    }

    if (user) {
      fetchApplicationStatus();
    }
  }, [authLoading, user]);

  const fetchApplicationStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/application-status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
      } else {
        setError(t('errors.fetchFailed'));
      }
    } catch (err) {
      console.error('Error fetching status:', err);
      setError(t('errors.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-16 h-16 text-yellow-600" />;
      case 'ACTIVE':
        return <CheckCircle className="w-16 h-16 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-16 h-16 text-red-600" />;
      case 'SUSPENDED':
        return <AlertTriangle className="w-16 h-16 text-orange-600" />;
      default:
        return <Clock className="w-16 h-16 text-neutral-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'from-yellow-50 to-yellow-100 border-yellow-200';
      case 'ACTIVE':
        return 'from-green-50 to-green-100 border-green-200';
      case 'REJECTED':
        return 'from-red-50 to-red-100 border-red-200';
      case 'SUSPENDED':
        return 'from-orange-50 to-orange-100 border-orange-200';
      default:
        return 'from-neutral-50 to-neutral-100 border-neutral-200';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          title: t('status.pending.title'),
          description: t('status.pending.description'),
          action: t('status.pending.action'),
        };
      case 'ACTIVE':
        return {
          title: t('status.active.title'),
          description: t('status.active.description'),
          action: t('status.active.action'),
        };
      case 'REJECTED':
        return {
          title: t('status.rejected.title'),
          description: t('status.rejected.description'),
          action: t('status.rejected.action'),
        };
      case 'SUSPENDED':
        return {
          title: t('status.suspended.title'),
          description: t('status.suspended.description'),
          action: t('status.suspended.action'),
        };
      default:
        return {
          title: t('status.unknown.title'),
          description: t('status.unknown.description'),
          action: t('status.unknown.action'),
        };
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-black mb-2">{t('errors.title')}</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button
            onClick={fetchApplicationStatus}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            {t('errors.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  if (!status?.hasApplication) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
          <Mail className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-black mb-2">{t('noApplication.title')}</h2>
          <p className="text-neutral-600 mb-6">{t('noApplication.description')}</p>
          <Link
            href="/become-seller"
            className="inline-block px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-colors"
          >
            {t('noApplication.applyButton')}
          </Link>
        </div>
      </div>
    );
  }

  const { store } = status;
  const statusInfo = getStatusMessage(store!.status);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-neutral-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/dashboard/buyer"
            className="inline-flex items-center gap-2 text-neutral-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('page.backButton')}
          </Link>
          <h1 className="text-3xl font-bold">{t('page.title')}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-br ${getStatusColor(store!.status)} rounded-xl shadow-sm border-2 p-8 mb-8`}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-6">{getStatusIcon(store!.status)}</div>
            <h2 className="text-2xl font-bold text-black mb-2">{statusInfo.title}</h2>
            <p className="text-neutral-700 max-w-2xl mb-6">{statusInfo.description}</p>

            {/* Store Info */}
            <div className="bg-white rounded-lg p-6 w-full max-w-md mb-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                  <span className="text-sm font-medium text-neutral-600">
                    {t('storeInfo.storeName')}
                  </span>
                  <span className="text-sm font-bold text-black">{store!.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                  <span className="text-sm font-medium text-neutral-600">
                    {t('storeInfo.status')}
                  </span>
                  <span
                    className={`text-sm font-bold uppercase ${
                      store!.status === 'PENDING'
                        ? 'text-yellow-600'
                        : store!.status === 'ACTIVE'
                          ? 'text-green-600'
                          : store!.status === 'REJECTED'
                            ? 'text-red-600'
                            : 'text-orange-600'
                    }`}
                  >
                    {store!.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-600">
                    {t('storeInfo.appliedOn')}
                  </span>
                  <span className="text-sm font-bold text-black flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(store!.appliedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {store!.approvedAt && (
                  <div className="flex justify-between items-center border-t border-neutral-200 pt-3">
                    <span className="text-sm font-medium text-neutral-600">
                      {t('storeInfo.approvedOn')}
                    </span>
                    <span className="text-sm font-bold text-black flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(store!.approvedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            {store!.status === 'ACTIVE' ? (
              <Link
                href="/seller/dashboard"
                className="px-8 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-colors shadow-md"
              >
                {t('actions.goToDashboard')}
              </Link>
            ) : store!.status === 'PENDING' ? (
              <button
                onClick={fetchApplicationStatus}
                className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-100 transition-colors shadow-md border border-neutral-200"
              >
                {t('actions.refreshStatus')}
              </button>
            ) : store!.status === 'REJECTED' ? (
              <Link
                href="/become-seller"
                className="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-neutral-800 transition-colors shadow-md"
              >
                {t('actions.reapply')}
              </Link>
            ) : (
              <Link
                href="/support"
                className="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-neutral-800 transition-colors shadow-md"
              >
                {t('actions.contactSupport')}
              </Link>
            )}
          </div>
        </motion.div>

        {/* Timeline for PENDING status */}
        {store!.status === 'PENDING' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8"
          >
            <h3 className="text-lg font-bold text-black mb-6">{t('timeline.title')}</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-black">{t('timeline.submitted.title')}</p>
                  <p className="text-sm text-neutral-600">{t('timeline.submitted.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-semibold text-black">{t('timeline.underReview.title')}</p>
                  <p className="text-sm text-neutral-600">
                    {t('timeline.underReview.description')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-neutral-400" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-400">{t('timeline.decision.title')}</p>
                  <p className="text-sm text-neutral-500">{t('timeline.decision.description')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mt-8"
        >
          <h3 className="text-lg font-bold text-black mb-4">{t('help.title')}</h3>
          <p className="text-neutral-600 mb-4">{t('help.description')}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/support"
              className="px-6 py-2 bg-neutral-100 text-black rounded-lg hover:bg-neutral-200 transition-colors font-medium"
            >
              {t('help.contactSupport')}
            </Link>
            <Link
              href="/seller-guide"
              className="px-6 py-2 bg-neutral-100 text-black rounded-lg hover:bg-neutral-200 transition-colors font-medium"
            >
              {t('help.sellerGuidelines')}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
