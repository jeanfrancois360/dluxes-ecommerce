'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Profile Page - Redirects to appropriate dashboard
 * TODO: Implement profile management functionality
 */
export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to account dashboard (which will then redirect to role-specific dashboard)
    router.push('/account');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-black mb-4"></div>
        <p className="text-neutral-600">Redirecting...</p>
      </div>
    </div>
  );
}
