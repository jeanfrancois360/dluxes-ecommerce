/**
 * Card Expiry Badge Component
 * Shows visual warnings for expiring or expired cards
 */

'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface CardExpiryBadgeProps {
  expMonth: number;
  expYear: number;
}

export function getCardExpiryStatus(expMonth: number, expYear: number) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-indexed

  // Card expires at the end of the expiry month
  const expiryDate = new Date(expYear, expMonth, 0); // Last day of expiry month
  const today = new Date(currentYear, currentMonth - 1, now.getDate());

  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired' as const, days: Math.abs(diffDays), color: 'red' as const };
  } else if (diffDays <= 30) {
    return { status: 'expiring_soon' as const, days: diffDays, color: 'orange' as const };
  } else if (diffDays <= 60) {
    return { status: 'expiring' as const, days: diffDays, color: 'yellow' as const };
  }

  return { status: 'valid' as const, days: diffDays, color: 'green' as const };
}

export function CardExpiryBadge({ expMonth, expYear }: CardExpiryBadgeProps) {
  const t = useTranslations('components.cardExpiryBadge');
  const expiryInfo = getCardExpiryStatus(expMonth, expYear);

  if (expiryInfo.status === 'valid') {
    return null; // Don't show anything for valid cards
  }

  const getBadgeConfig = () => {
    switch (expiryInfo.status) {
      case 'expired':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ),
          label: t('expired'),
        };
      case 'expiring_soon':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-700',
          border: 'border-orange-200',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
          label: t('expiresInDays', { days: expiryInfo.days }),
        };
      case 'expiring':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          border: 'border-yellow-200',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          ),
          label: t('expiresInDays', { days: expiryInfo.days }),
        };
      default:
        return null;
    }
  };

  const config = getBadgeConfig();
  if (!config) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </motion.div>
  );
}

export default CardExpiryBadge;
