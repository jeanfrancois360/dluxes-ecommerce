'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, ShieldCheck, X } from 'lucide-react';
import useSWR from 'swr';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api/client';

const ENFORCED_ROLES = new Set(['SELLER', 'ADMIN', 'SUPER_ADMIN', 'DELIVERY_PARTNER']);

interface TwoFactorBannerProps {
  /** URL to the 2FA setup page — defaults to /seller/security */
  setupUrl?: string;
  /** Grace days remaining returned from the API, if any */
  graceDaysRemaining?: number | null;
}

/**
 * Displays a persistent banner prompting users in enforced roles to set up 2FA.
 * Disappears automatically once twoFactorEnabled is true.
 * Can be manually dismissed for the current session (reappears on next load).
 */
export default function TwoFactorBanner({
  setupUrl = '/seller/security',
  graceDaysRemaining,
}: TwoFactorBannerProps) {
  const { user, isAuthenticated } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const { data: emailOtpStatus } = useSWR(
    isAuthenticated ? '/auth/2fa/email/status' : null,
    () => api.get<{ enabled: boolean }>('/auth/2fa/email/status'),
    { revalidateOnFocus: false }
  );

  // Re-show if the user navigates away and comes back
  useEffect(() => {
    setDismissed(false);
  }, [user?.id]);

  if (!user) return null;
  if (!ENFORCED_ROLES.has(user.role)) return null;
  if (user.twoFactorEnabled || emailOtpStatus?.enabled) return null;
  if (dismissed) return null;

  const isUrgent =
    graceDaysRemaining !== null && graceDaysRemaining !== undefined && graceDaysRemaining <= 3;
  const isExpired =
    graceDaysRemaining !== null && graceDaysRemaining !== undefined && graceDaysRemaining <= 0;

  const bgColor =
    isExpired || isUrgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
  const iconColor = isExpired || isUrgent ? 'text-red-500' : 'text-amber-500';
  const titleColor = isExpired || isUrgent ? 'text-red-800' : 'text-amber-800';
  const textColor = isExpired || isUrgent ? 'text-red-700' : 'text-amber-700';
  const btnClass =
    isExpired || isUrgent
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-amber-600 hover:bg-amber-700 text-white';

  const getMessage = () => {
    if (isExpired) {
      return 'Your 2FA grace period has expired. You will be locked out on next login.';
    }
    if (isUrgent && graceDaysRemaining! > 0) {
      return `${graceDaysRemaining} day${graceDaysRemaining === 1 ? '' : 's'} left to enable 2FA before your account is restricted.`;
    }
    if (graceDaysRemaining !== null && graceDaysRemaining !== undefined) {
      return `You have ${graceDaysRemaining} day${graceDaysRemaining === 1 ? '' : 's'} to enable two-factor authentication.`;
    }
    return 'Protect your account by enabling two-factor authentication.';
  };

  return (
    <div className={`border-b ${bgColor} px-4 py-3`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
          <div className="min-w-0">
            <span className={`font-semibold text-sm ${titleColor}`}>
              Two-Factor Authentication Required&nbsp;
            </span>
            <span className={`text-sm ${textColor}`}>{getMessage()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={setupUrl}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${btnClass}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Set up 2FA
          </Link>

          {!isExpired && (
            <button
              onClick={() => setDismissed(true)}
              className={`p-1 rounded hover:bg-black/10 transition-colors ${textColor}`}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
