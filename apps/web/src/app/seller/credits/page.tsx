'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function SellerCreditsRedirect() {
  const router = useRouter();
  const t = useTranslations('common');

  useEffect(() => {
    // Redirect to platform subscription page
    router.replace('/seller/selling-credits');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">{t('redirecting')}</p>
      </div>
    </div>
  );
}
