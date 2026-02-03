'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SellerCreditsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to platform subscription page
    router.replace('/seller/selling-credits');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
